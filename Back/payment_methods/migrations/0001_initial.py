import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('users', '0002_address_paymentmethod'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='PaymentMethod',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('tipo', models.CharField(choices=[('tarjeta', 'Tarjeta'), ('nequi', 'Nequi'), ('daviplata', 'Daviplata'), ('pse', 'PSE'), ('efectivo', 'Efectivo')], default='tarjeta', max_length=20)),
                        ('alias', models.CharField(default='Mi tarjeta', max_length=60)),
                        ('titular', models.CharField(blank=True, max_length=120)),
                        ('marca', models.CharField(blank=True, max_length=40)),
                        ('ultimos4', models.CharField(blank=True, max_length=4)),
                        ('mes_expira', models.PositiveSmallIntegerField(blank=True, null=True)),
                        ('anio_expira', models.PositiveSmallIntegerField(blank=True, null=True)),
                        ('is_default', models.BooleanField(default=False)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('user', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='payment_methods', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                        'ordering': ['-is_default', 'id'],
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
