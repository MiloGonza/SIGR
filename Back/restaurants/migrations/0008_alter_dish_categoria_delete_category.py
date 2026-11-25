import django.db.models.deletion
from django.db import migrations, models


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0001_initial'),
        ('restaurants', '0007_alter_notification_tipo'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.AlterField(
                    model_name='dish',
                    name='categoria',
                    field=models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='platillos', to='categories.category'),
                ),
                migrations.DeleteModel(
                    name='Category',
                ),
            ],
            database_operations=[],
        ),
    ]
