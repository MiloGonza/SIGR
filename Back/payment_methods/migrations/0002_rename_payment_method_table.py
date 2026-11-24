from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('orders', '0005_alter_order_payment_method'),
        ('payment_methods', '0001_initial'),
        ('users', '0003_delete_paymentmethod'),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER TABLE users_paymentmethod RENAME TO payment_methods_paymentmethod;',
            reverse_sql='ALTER TABLE payment_methods_paymentmethod RENAME TO users_paymentmethod;',
        ),
    ]
