import django.db.models.deletion
import uuid
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = []

    operations = [
        migrations.CreateModel(
            name="Table",
            fields=[
                ("id", models.UUIDField(default=uuid.uuid4, editable=False, primary_key=True, serialize=False)),
                ("nombre", models.CharField(max_length=50)),
                ("capacidad", models.PositiveSmallIntegerField(default=4)),
                ("esta_disponible", models.BooleanField(default=True)),
                ("created_at", models.DateTimeField(auto_now_add=True)),
                ("updated_at", models.DateTimeField(auto_now=True)),
                ("restaurante", models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name="mesas", to="restaurants.restaurant")),
            ],
            options={"ordering": ["restaurante", "nombre"]},
        ),
    ]
