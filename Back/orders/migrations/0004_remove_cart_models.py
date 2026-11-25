from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('carts', '0001_initial'),
        ('orders', '0003_normalize_payment_summaries'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.DeleteModel(
                    name='CartItem',
                ),
                migrations.DeleteModel(
                    name='Cart',
                ),
            ],
            database_operations=[],
        ),
    ]
