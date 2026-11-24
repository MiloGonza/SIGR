from django.utils.text import slugify


def unique_slug(model, value, instance_pk=None, fallback="registro"):
	"""Genera un slug único para cualquier modelo que tenga un campo slug."""
	base = slugify(value) or fallback
	slug = base
	counter = 2
	while model.objects.filter(slug=slug).exclude(pk=instance_pk).exists():
		slug = f"{base}-{counter}"
		counter += 1
	return slug
