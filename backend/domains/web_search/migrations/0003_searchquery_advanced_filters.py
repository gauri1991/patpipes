from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('web_search', '0002_googlesearchconfig'),
    ]

    operations = [
        migrations.AddField(
            model_name='searchquery',
            name='site_filter',
            field=models.CharField(blank=True, default='', max_length=253),
        ),
        migrations.AddField(
            model_name='searchquery',
            name='file_type',
            field=models.CharField(
                blank=True,
                choices=[
                    ('pdf', 'PDF'),
                    ('doc', 'Word Document'),
                    ('ppt', 'PowerPoint'),
                    ('xls', 'Excel'),
                    ('txt', 'Plain Text'),
                ],
                default='',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='searchquery',
            name='date_restrict',
            field=models.CharField(
                blank=True,
                choices=[
                    ('d1', 'Past day'),
                    ('w1', 'Past week'),
                    ('m1', 'Past month'),
                    ('m3', 'Past 3 months'),
                    ('m6', 'Past 6 months'),
                    ('y1', 'Past year'),
                ],
                default='',
                max_length=10,
            ),
        ),
        migrations.AddField(
            model_name='searchquery',
            name='exact_terms',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
        migrations.AddField(
            model_name='searchquery',
            name='exclude_terms',
            field=models.CharField(blank=True, default='', max_length=500),
        ),
    ]
