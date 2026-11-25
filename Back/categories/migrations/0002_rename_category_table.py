from django.db import migrations


class Migration(migrations.Migration):

    dependencies = [
        ('categories', '0001_initial'),
        ('restaurants', '0008_alter_dish_categoria_delete_category'),
    ]

    operations = [
        migrations.RunSQL(
            sql='ALTER TABLE restaurants_category RENAME TO categories_category;',
            reverse_sql='ALTER TABLE categories_category RENAME TO restaurants_category;',
        ),
    ]
