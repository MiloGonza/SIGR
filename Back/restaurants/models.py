from django.db import models
import uuid

class Restaurant(models.Model):
	id = models.UUIDField(primary_key=True, default=uuid.uuid4, editable=False, auto_created=True)
	nombre = models.CharField(max_length=100)
