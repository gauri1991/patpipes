"""
Management command to check deadlines and send reminder notifications
Run this as a cron job or Celery task (e.g., daily at 8 AM)

Usage:
    python manage.py send_deadline_reminders
    python manage.py send_deadline_reminders --days 7
"""

from django.core.management.base import BaseCommand
from django.utils import timezone
from django.core.mail import send_mail
from django.conf import settings
from datetime import timedelta

from domains.prosecution.models import ProsecutionDeadline
from domains.collaboration.models import Notification
from domains.collaboration.utils import create_and_send_notification


class Command(BaseCommand):
    help = 'Send reminder notifications for upcoming prosecution deadlines'

    def add_arguments(self, parser):
        parser.add_argument(
            '--days',
            type=int,
            default=7,
            help='Number of days ahead to check for deadlines (default: 7)'
        )
        parser.add_argument(
            '--dry-run',
            action='store_true',
            help='Print reminders without actually sending them'
        )

    def handle(self, *args, **options):
        days_ahead = options['days']
        dry_run = options['dry_run']

        today = timezone.now().date()
        reminder_date = today + timedelta(days=days_ahead)

        # Find deadlines that:
        # 1. Are due within the specified days
        # 2. Are not completed or cancelled
        # 3. Haven't had a reminder sent recently
        deadlines = ProsecutionDeadline.objects.filter(
            due_date__lte=reminder_date,
            due_date__gte=today,
            is_completed=False,
            is_cancelled=False,
            reminder_sent=False
        ).select_related('application', 'assigned_to')

        self.stdout.write(f"Found {deadlines.count()} deadlines to process")

        reminders_sent = 0
        errors = 0

        for deadline in deadlines:
            try:
                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] Would send reminder for: {deadline.title} "
                        f"(Due: {deadline.due_date}) to {deadline.assigned_to}"
                    )
                else:
                    self.send_reminder(deadline)
                    reminders_sent += 1
            except Exception as e:
                self.stderr.write(f"Error sending reminder for {deadline.id}: {e}")
                errors += 1

        # Also check for critical deadlines (due within 3 days)
        critical_date = today + timedelta(days=3)
        critical_deadlines = ProsecutionDeadline.objects.filter(
            due_date__lte=critical_date,
            due_date__gte=today,
            is_completed=False,
            is_cancelled=False,
            priority__in=['high', 'critical']
        ).select_related('application', 'assigned_to')

        for deadline in critical_deadlines:
            try:
                if dry_run:
                    self.stdout.write(
                        f"[DRY RUN] Would send URGENT reminder for: {deadline.title} "
                        f"(Due: {deadline.due_date})"
                    )
                else:
                    self.send_urgent_reminder(deadline)
                    reminders_sent += 1
            except Exception as e:
                self.stderr.write(f"Error sending urgent reminder for {deadline.id}: {e}")
                errors += 1

        self.stdout.write(
            self.style.SUCCESS(
                f"Completed: {reminders_sent} reminders sent, {errors} errors"
            )
        )

    def send_reminder(self, deadline):
        """Send a reminder notification for a deadline"""
        user = deadline.assigned_to

        if not user:
            # If no specific user assigned, notify the attorney
            user = deadline.application.attorney

        if not user:
            self.stdout.write(f"No user to notify for deadline: {deadline.id}")
            return

        days_until = (deadline.due_date - timezone.now().date()).days

        # Create in-app notification
        create_and_send_notification(
            user=user,
            notification_type=Notification.NotificationType.DEADLINE_REMINDER,
            title=f"Deadline Reminder: {deadline.title}",
            message=f"You have a deadline coming up in {days_until} days for "
                    f"'{deadline.application.title}'. Due date: {deadline.due_date}",
            related_object=deadline,
            action_url=f"/dashboard/prosecution/applications/{deadline.application.id}",
            priority='high' if deadline.priority in ['high', 'critical'] else 'normal'
        )

        # Send email notification if enabled
        if hasattr(user, 'settings') and user.settings.email_notifications:
            self.send_email_reminder(user, deadline, days_until)

        # Mark reminder as sent
        deadline.reminder_sent = True
        if not deadline.reminder_dates:
            deadline.reminder_dates = []
        deadline.reminder_dates.append(timezone.now().isoformat())
        deadline.save()

    def send_urgent_reminder(self, deadline):
        """Send an urgent reminder for critical deadlines"""
        user = deadline.assigned_to or deadline.application.attorney

        if not user:
            return

        days_until = (deadline.due_date - timezone.now().date()).days

        # Create urgent in-app notification
        create_and_send_notification(
            user=user,
            notification_type=Notification.NotificationType.DEADLINE_REMINDER,
            title=f"URGENT: {deadline.title}",
            message=f"URGENT: Only {days_until} days remaining! Deadline for "
                    f"'{deadline.application.title}' is on {deadline.due_date}",
            related_object=deadline,
            action_url=f"/dashboard/prosecution/applications/{deadline.application.id}",
            priority='urgent'
        )

        # Always send email for urgent reminders
        self.send_email_reminder(user, deadline, days_until, urgent=True)

    def send_email_reminder(self, user, deadline, days_until, urgent=False):
        """Send an email reminder"""
        subject_prefix = "URGENT: " if urgent else ""
        subject = f"{subject_prefix}Deadline Reminder: {deadline.title}"

        message = f"""
Dear {user.full_name},

{'URGENT REMINDER' if urgent else 'Reminder'}: You have an upcoming deadline.

Deadline: {deadline.title}
Application: {deadline.application.title} ({deadline.application.application_number or 'Draft'})
Due Date: {deadline.due_date}
Days Remaining: {days_until}
Priority: {deadline.get_priority_display()}

{deadline.description if deadline.description else ''}

Please take the necessary action to complete this deadline on time.

Best regards,
Patent Analytics Platform
        """.strip()

        try:
            send_mail(
                subject=subject,
                message=message,
                from_email=settings.DEFAULT_FROM_EMAIL,
                recipient_list=[user.email],
                fail_silently=False
            )
        except Exception as e:
            self.stderr.write(f"Failed to send email to {user.email}: {e}")
