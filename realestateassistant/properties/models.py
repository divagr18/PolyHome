from django.db import models
from clients.models import Client
class Property(models.Model):
    address = models.CharField(max_length=255)
    description = models.TextField()
    price = models.DecimalField(max_digits=10, decimal_places=2)
    bedrooms = models.IntegerField()
    bathrooms = models.IntegerField()
    square_footage = models.IntegerField()
    amenities = models.TextField(blank=True, null=True)

    def __str__(self):
        return self.address
class PropertyKeyPoints(models.Model):
    property = models.ForeignKey(Property, related_name='key_points_set', on_delete=models.CASCADE)
    key_point_text = models.TextField()

    def __str__(self):
        return f"Key Point for {self.property.name}: {self.key_point_text}"

class Offer(models.Model):
    property = models.ForeignKey(Property, related_name='offers_set', on_delete=models.CASCADE)
    client = models.ForeignKey(Client, related_name='property_offers', on_delete=models.CASCADE) 
    price = models.CharField(max_length=50) 

    class Meta:
        unique_together = ('property', 'client') 

    def __str__(self):
        return f"Offer for {self.property.name} from Client {self.client.id}: {self.price}"