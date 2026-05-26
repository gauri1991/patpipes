# Generated migration to add data_source field to ODPEnrichmentJob

from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('patents', '0012_add_filters_to_enrichment_job'),
    ]

    operations = [
        migrations.AddField(
            model_name='odpenrichmentjob',
            name='data_source',
            field=models.CharField(
                choices=[('odp', 'USPTO ODP'), ('lens', 'Lens.org')],
                default='odp',
                max_length=10,
            ),
        ),
    ]
