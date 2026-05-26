from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('analytics', '0021_add_sales_package_vp_fields'),
    ]

    operations = [
        migrations.AddField(
            model_name='salespackage',
            name='meta_tags',
            field=models.JSONField(blank=True, null=True, help_text='Block 7 meta tags: industries, technologies, transactions'),
        ),
        migrations.AddField(
            model_name='salespackage',
            name='lint_results',
            field=models.JSONField(blank=True, null=True, help_text='§15 failure-mode lint results'),
        ),
        migrations.AddField(
            model_name='salespackage',
            name='quality_gates',
            field=models.JSONField(blank=True, null=True, help_text='§17 quality gate results'),
        ),
        migrations.AddField(
            model_name='salespackage',
            name='tier_validation',
            field=models.JSONField(blank=True, null=True, help_text='§5.5 tier coverage validation'),
        ),
        migrations.AddField(
            model_name='salespackage',
            name='suggested_archetype',
            field=models.CharField(
                max_length=10, blank=True,
                choices=[
                    ('OC-DEF', 'Operating Co. — Defensive'),
                    ('OC-OFF', 'Operating Co. — Offensive'),
                    ('OC-EXP', 'Operating Co. — Market Expansion'),
                    ('NPE-LIC', 'NPE — Licensing'),
                    ('NPE-LIT', 'NPE — Litigation'),
                    ('DEF-AGG', 'Defensive Aggregator'),
                    ('LIT-FIN', 'Litigation Finance'),
                ],
                help_text='§4.5 auto-suggested archetype',
            ),
        ),
        migrations.AddField(
            model_name='salespackage',
            name='archetype_reason',
            field=models.TextField(blank=True, help_text='Reason for suggested archetype'),
        ),
        migrations.AddField(
            model_name='salespackage',
            name='generated_deck',
            field=models.TextField(blank=True, help_text='Rung 3 non-confidential offering deck (markdown)'),
        ),
        migrations.AddField(
            model_name='salespackage',
            name='generated_cim',
            field=models.TextField(blank=True, help_text='Rung 4 CIM outline (markdown)'),
        ),
    ]
