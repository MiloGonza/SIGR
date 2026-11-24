from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_alter_order_payment_method'),
        ('users', '0002_address_paymentmethod'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(
                    name='PaymentMethod',
                ),
            ],
            database_operations=[],
        ),
    ]
