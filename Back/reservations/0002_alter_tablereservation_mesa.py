from django.db import migrations, models
import django.db.models.deletion


class Migration(migrations.Migration):

    dependencies = [
        ("reservations", "0001_initial"),
    ]

    operations = [
        migrations.AlterField(
            model_name="tablereservation",
            name="mesa",
            field=models.ForeignKey(
                on_delete=django.db.models.deletion.CASCADE,
                related_name="reservas",
                to="tables.table",
                verbose_name="Mesa",
            ),
        ),
    ]
