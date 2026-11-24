from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('carts', '0001_initial'),
        ('orders', '0004_remove_cart_models'),
    ]

    operations = [
        migrations.RunSQL(
            sql=[
                'ALTER TABLE orders_cart RENAME TO carts_cart;',
                'ALTER TABLE orders_cartitem RENAME TO carts_cartitem;',
            ],
            reverse_sql=[
                'ALTER TABLE carts_cartitem RENAME TO orders_cartitem;',
                'ALTER TABLE carts_cart RENAME TO orders_cart;',
            ],
        ),
    ]
