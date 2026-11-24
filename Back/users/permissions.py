from .models import Profile


def get_admin_profile(user):
	"""Perfil de administrador que tiene un restaurante asociado."""
	profile = getattr(user, "profile", None)
	if (
		profile
		and profile.rol == Profile.ADMINISTRADOR
		and profile.restaurante_id
	):
		return profile
	return None


def get_staff_profile(user):
	"""Perfil de administrador o mesero que pertenece a una tienda."""
	profile = getattr(user, "profile", None)
	if (
		profile
		and profile.rol in (Profile.ADMINISTRADOR, Profile.MESERO)
		and profile.restaurante_id
	):
		return profile
	return None


def is_restaurant_staff(user):
	return get_staff_profile(user) is not None
