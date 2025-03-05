
from rest_framework.views import APIView
from rest_framework.response import Response
from rest_framework import status
from .models import Property, Offer  
from clients.models import Client
from django.shortcuts import get_object_or_404
import random
from appointments.models import Appointment  
from appointments.serializers import AppointmentSerializer


class RandomPropertiesView(APIView):
    def get(self, request):
        properties_data = []

        property_names = [
            "Cozy Apartment in Downtown",
            "Luxury Villa with Ocean View",
            "Modern Townhouse in Suburbs",
            "Charming Cottage in Countryside",
            "Spacious Condo near Park",
            "Elegant Penthouse with Cityscape"
        ]
        locations = [
            "Downtown", "Ocean View", "Suburbs", "Countryside", "Park", "Cityscape"
        ]
        image_filenames = [
            "bhandup_apartment.jpg",
            "dadar_apartment.png",
            "airoli.jpg",
            "villa_in_7_bunglows.jpeg",
            "versova_house.jpg",
            "worli_apartment.jpg",
        ]
        descriptions = [
            "Modern and stylish apartment in the heart of downtown.",
            "Luxurious villa with breathtaking ocean views.",
            "Spacious townhouse perfect for family living in the suburbs.",
            "Quaint cottage nestled in the peaceful countryside.",
            "Comfortable condo conveniently located near Central Park.",
            "Exclusive penthouse offering elegant living with cityscape panoramas."
        ]
        features_options = [
            ["Gym", "Pool", "Parking", "Balcony"],
            ["Private Garden", "Spa", "Home Theater", "Gourmet Kitchen"],
            ["Garage", "Large Backyard", "Play Area", "Community Center"],
            ["Fireplace", "Lake Access", "Hiking Trails", "Pet Friendly"],
            ["Concierge", "Rooftop Terrace", "City Views", "Walkable"],
            ["Floor-to-ceiling Windows", "Smart Home", "Wine Cellar", "Valet Parking"]
        ]
        prices = [
            "₹25,000/mo", "₹35,000/mo", "₹21,000/mo", "₹15,000/mo", "₹55,000/mo", "₹95,000/mo"
        ]
        bedrooms_options = [2, 4, 3, 2, 2, 3]
        bathrooms_options = [2, 3, 2.5, 2, 2, 3]
        sqft_options = [1200, 2500, 1800, 1100, 1250, 2000]

        property_ids = [1, 2, 3, 4, 5, 6]

        for i in range(6):
            property_id = property_ids[i]
            property_name = property_names[i]  

            
            offers = Offer.objects.filter(property_id=property_id)

            offers_data = []  
            for offer in offers:
                try:
                    client = get_object_or_404(Client, pk=offer.client_id)  
                    offers_data.append({
                        "id": offer.id,  
                        "price": offer.price,
                        "client_id": offer.client_id,
                        "client_name": client.name  
                    })
                except:
                    print("Unknown Client")
                    continue

            
            appointments = Appointment.objects.filter(property_name=property_name)
            appointments_data = []  
            for appointment in appointments:
                serializer = AppointmentSerializer(appointment)
                appointments_data.append(serializer.data) 

            property_data = {
                "id": property_id,
                "name": property_name,
                "location": locations[i],
                "image": f"/images/properties/{image_filenames[i]}",
                "description": descriptions[i],
                "price": prices[i],
                "bedrooms": bedrooms_options[i],
                "bathrooms": bathrooms_options[i],
                "square_footage": sqft_options[i],
                "amenities": ", ".join(random.sample(features_options[i], random.randint(2, 4))),
                "offers": offers_data,
                "appointments": appointments_data,  
            }
            properties_data.append(property_data)

        return Response(properties_data, status=status.HTTP_200_OK)