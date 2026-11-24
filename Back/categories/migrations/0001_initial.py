from django.db import migrations, models


class Migration(migrations.Migration):

    initial = True

    dependencies = [
        ('restaurants', '0007_alter_notification_tipo'),
    ]

    operations = [
        migrations.SeparateDatabaseAndState(
            state_operations=[
                migrations.CreateModel(
                    name='Category',
                    fields=[
                        ('id', models.BigAutoField(auto_created=True, primary_key=True, serialize=False, verbose_name='ID')),
                        ('nombre', models.CharField(max_length=80, unique=True)),
                        ('slug', models.SlugField(blank=True, max_length=100, unique=True)),
                        ('icon', models.CharField(default='UtensilsCrossed', max_length=40)),
                        ('orden', models.PositiveSmallIntegerField(default=0)),
                        ('is_active', models.BooleanField(default=True)),
                    ],
                    options={
                        'verbose_name_plural': 'categories',
                        'ordering': ['orden', 'nombre'],
                    },
                ),
            ],
            database_operations=[],
        ),
    ]
