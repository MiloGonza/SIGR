import django.db.models.deletion
from django.conf import settings
from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('restaurants', '0008_alter_dish_categoria_delete_category'),
        migrations.swappable_dependency(settings.AUTH_USER_MODEL),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='Cart',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('updated_at', models.DateTimeField(auto_now=True)),
                        ('restaurante', models.ForeignKey(blank=True, null=True, on_delete=django.db.models.deletion.SET_NULL, related_name='carts', to='restaurants.restaurant')),
                        ('user', models.OneToOneField(on_delete=django.db.models.deletion.CASCADE, related_name='cart', to=settings.AUTH_USER_MODEL)),
                    ],
                    options={
                    },
                ),
                migrations.CreateModel(
                    name='CartItem',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('cantidad', models.PositiveSmallIntegerField(default=1)),
                        ('notas', models.CharField(blank=True, max_length=200)),
                        ('created_at', models.DateTimeField(auto_now_add=True)),
                        ('cart', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='items', to='carts.cart')),
                        ('dish', models.ForeignKey(on_delete=django.db.models.deletion.CASCADE, related_name='cart_items', to='restaurants.dish')),
                    ],
                    options={
                        'ordering': ['id'],
                        'constraints': [models.UniqueConstraint(fields=('cart', 'dish'), name='unique_cart_dish')],
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
