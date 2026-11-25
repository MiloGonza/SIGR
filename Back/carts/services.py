from .models import Cart


def get_cart(user):
	cart, _ = Cart.objects.get_or_create(user=user)
	return cart
