
from rest_framework import generics, status
from rest_framework.response import Response
from .models import Chat
from .serializers import ChatSerializer
from clients.models import Client
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from rest_framework import permissions
from django.db.models import Q
from django.conf import settings
import openai
import json
import logging  
from properties.models import Property, Offer
from appointments.models import Appointment  
from appointments.serializers import AppointmentSerializer
import datetime
from django.utils import timezone


logger = logging.getLogger(__name__)  

User = get_user_model()

class ChatListCreateView(generics.ListCreateAPIView):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer
    

    def perform_create(self, serializer):
        
        sender_id = self.request.data.get('sender')
        recipient_id = self.request.data.get('recipient')

        
        try:
            sender = get_object_or_404(User, pk=sender_id)
        except:
            sender = get_object_or_404(Client, pk=sender_id).user

        
        client = get_object_or_404(Client, pk=recipient_id)

        serializer.save(sender=sender, recipient=client)

class ChatRetrieveUpdateDestroyView(generics.RetrieveUpdateDestroyAPIView):
    queryset = Chat.objects.all()
    serializer_class = ChatSerializer

class ChatHistoryView(generics.ListAPIView):
    serializer_class = ChatSerializer

    def get_queryset(self):
        client_id = self.request.query_params.get('client_id')  
        language = self.request.query_params.get('language')  

        if client_id:
            
            client = get_object_or_404(Client, pk=client_id)
            agent_user = get_object_or_404(User,pk=1)

            
            queryset = Chat.objects.filter(Q(recipient=client) | Q(sender=client.user, recipient=agent_user)).order_by('timestamp')
            return queryset
        else:
            return Chat.objects.none()  

    def get_serializer_context(self):
        """Pass the language to the serializer context."""
        return {'language': self.request.query_params.get('language')}

class AgentClientChatHistoryView(generics.ListAPIView): 
    serializer_class = ChatSerializer

    def get_queryset(self):
        client_id = self.request.query_params.get('client_id')

        if client_id:
            client = get_object_or_404(Client, pk=client_id)
            agent_user = get_object_or_404(User, pk=1)

            
            agent_client = get_object_or_404(Client, user=agent_user) 
            

            
            queryset = Chat.objects.filter(
                (Q(sender=agent_user, recipient=client) | Q(sender=client.user, recipient=agent_client)) 
            ).order_by('timestamp')
            return queryset
        else:
            return Chat.objects.none()

    def get_serializer_context(self):
        """Pass the language to the serializer context."""
        return {'language': self.request.query_params.get('language')}

    def list(self, request, *args, **kwargs): 
        key_points_list = [] 
        buyer_info_extracted_data = {} 
        queryset = self.get_queryset() 
        serializer = self.get_serializer(queryset, many=True) 

        
        client_id = self.request.query_params.get('client_id')
        client = get_object_or_404(Client, pk=client_id)
        messages = queryset 
        conversation_text = "\n".join([msg.message for msg in messages])
        preferred_language = request.query_params.get('language') 

        if not conversation_text.strip():
            return Response({
                "chat_history": serializer.data, 
                "buyer_info": {}, 
                "key_points": [], 
                "offers": [], 
                "appointments": [],
                "message": "No conversation history found for combined extraction."
            }, status=status.HTTP_200_OK) 

        
        combined_prompt = f"""
        Analyze the following real estate buyer-agent conversation and extract FOUR types of information:

        1.  **Key Points:** Identify the main points, requirements, preferences, and important details from the buyer's messages (excluding offers and appointments). Return these as a JSON list of strings under the key "key_points".

        2.  **Buyer Information:** Extract specific buyer details. If a detail is not mentioned, return null. Return a JSON object under the key "buyer_info" with the following fields:
            - first_name
            - last_name
            - phone
            - email
            - desired_location
            - property_type
            - bedrooms
            - budget
            - special_notes

        3.  **Offers:** Identify if the buyer makes any offers on properties. If an offer is made, extract the **property name (or keywords to identify the property)** and the **offer price**. Return offers as a JSON list of objects under the key "offers". Each offer object should have keys "property_keywords" and "offer_price". If no offer is made, return an empty list for "offers".

        4.  **Appointments:** Extract ANY mentions of scheduling a viewing. If an appointment is mentioned, create an object with the following Keys:
            - property_name (or keywords to identify the property)
            - date (format YYYY-MM-DD)
            - time (format HH:MM, 24 hour clock)
            Example "Meet me at 2024-10-12 at 14:00 at Cozy Apartment in Downtown"
            Return appointments as a JSON list of objects under the key "appointments". If no appointment is scheduled, return an empty list.

        [CONVERSATION START]
        {conversation_text}
        [CONVERSATION END]

        ^-- Combined Output in JSON format:
        ```json
        {{
          "key_points": [ ... ],
          "buyer_info": {{ ... }},
          "offers": [ {{ "property_keywords": "...", "offer_price": "..." }}, ... ],
          "appointments": [{{ "property_name": "...", "date": "2025-MM-DD", "time": "HH:MM"}}, ...]
        }}
        ```
        """

        logger.info(f"Combined Prompt being sent to OpenAI: {combined_prompt}")

        key_points_list = []
        buyer_info_extracted_data = {}
        offers_extracted_data = []  
        appointments_extracted_data = []
        combined_response = None

        try:
            combined_response = openai.chat.completions.create(
                model="gpt-4o-mini",
                response_format={"type": "json_object"},
                messages=[
                    {"role": "system",
                     "content": "You are an expert at extracting information from real estate buyer-agent conversations. Return ALL requested information in a SINGLE JSON object as instructed."},
                    {"role": "user", "content": combined_prompt},
                ],
                temperature=0.2,
                max_tokens=700,
            )

            logger.info(f"Raw OpenAI Combined Response Content: {combined_response.choices[0].message.content}")

            combined_json_str = combined_response.choices[0].message.content
            combined_data = json.loads(combined_json_str)

            key_points_list = combined_data.get('key_points', [])
            buyer_info_extracted_data = combined_data.get('buyer_info', {})
            offers_extracted_data = combined_data.get('offers', [])  
            appointments_extracted_data = combined_data.get('appointments', [])

            if not isinstance(key_points_list, list):
                key_points_list = []

        except json.JSONDecodeError as json_e:
            key_points_list = []
            buyer_info_extracted_data = {}
            offers_extracted_data = []
            appointments_extracted_data = []
            logger.error(
                f"JSON Decode Error during combined extraction: {json_e}, response content: {combined_response.choices[0].message.content if combined_response and combined_response.choices else 'No response content'}")
        except Exception as combined_e:
            key_points_list = []
            buyer_info_extracted_data = {}
            offers_extracted_data = []
            appointments_extracted_data = []
            logger.error(f"OpenAI Combined Extraction Error: {combined_e}")

        logger.info(f"Extracted Key Points List: {key_points_list}")
        logger.info(f"Extracted Buyer Info Data: {buyer_info_extracted_data}")
        logger.info(f"Extracted Offers Data: {offers_extracted_data}")  
        logger.info(f"Extracted Appointment Data: {appointments_extracted_data}")

        
        for offer_data in offers_extracted_data:
            property_keywords = offer_data.get('property_keywords')
            offer_price = offer_data.get('offer_price')

            if property_keywords and offer_price:
                logger.info(
                    f"Attempting to save offer: Property Keywords='{property_keywords}', Offer Price='{offer_price}', Client ID={client.id}")  

                property_match = Property.objects.filter(address__icontains=property_keywords).first()

                if property_match:
                    logger.info(f"Property Matched: '{property_match.address}' (ID={property_match.id})")  

                    
                    existing_offer = Offer.objects.filter(property=property_match, client=client).first()
                    logger.info(
                        f"Existing Offer Query - Found Existing Offer: {'Yes' if existing_offer else 'No'}")  

                    try:
                        
                        offer_price = float(offer_price)

                        if existing_offer:
                            
                            logger.info(f"Updating Existing Offer ID={existing_offer.id}, New Price='{offer_price}'")  
                            existing_offer.price = offer_price
                            existing_offer.save()
                            logger.info(
                                f"Offer Updated Successfully for property '{property_match.address}' from client {client.id}: {offer_price}")
                        else:
                            
                            logger.info(
                                f"Creating NEW Offer for property '{property_match.address}', Price='{offer_price}'")  
                            Offer.objects.create(
                                property=property_match,
                                client=client,
                                price=offer_price
                            )
                            logger.info(
                                f"Offer Saved Successfully for property '{property_match.address}' from client {client.id}: {offer_price}")
                    except ValueError as ve:  
                        logger.error(f"Invalid offer_price format '{offer_price}': {ve}")
                    except Exception as save_offer_error:
                        logger.error(f"Error saving/updating offer for property '{property_match.address}': {save_offer_error}")
                else:
                    logger.warning(f"Could not match property for offer with keywords: '{property_keywords}'")
            else:
                logger.warning(f"Skipping offer save - Missing property_keywords or offer_price in extracted data.")

        
        for appointment_data in appointments_extracted_data:
            property_name = appointment_data.get('property_name')
            date_str = appointment_data.get('date')
            time_str = appointment_data.get('time')

            if property_name and date_str and time_str:
                try:
                    
                    datetime_str = f"{date_str} {time_str}"
                    datetime_object = datetime.datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
                    datetime_object = timezone.make_aware(datetime_object)

                    
                    logger.info(f"Creating NEW Appointment for property '{property_name}', Date/Time='{datetime_object}'")  
                    Appointment.objects.create(
                        property_name=property_name,
                        client=client,
                        agent=get_object_or_404(User, pk=1),
                        date_time=datetime_object
                    )
                    logger.info(f"Appointment Saved Successfully for property '{property_name}' from client {client.id}: {datetime_object}")
                except ValueError as ve:  
                    logger.error(f"Invalid datetime format '{date_str} {time_str}': {ve}")
                except Exception as save_appointment_error:
                    logger.error(f"Error saving appointment for property '{property_name}': {save_appointment_error}")
            else:
                logger.warning(f"Skipping appointment save - Missing property_name, date, or time in extracted data.")

        
        return Response({
            "chat_history": serializer.data,
            "buyer_info": buyer_info_extracted_data,
            "key_points": key_points_list,
            "offers": offers_extracted_data,
            "appointments": appointments_extracted_data 
        }, status=status.HTTP_200_OK)


class ExtractBuyerInfoView(generics.ListAPIView): 
    
    pass 


from rest_framework import serializers
from .models import Chat
from django.contrib.auth import get_user_model
from clients.models import Client
import openai  
from django.conf import settings

User = get_user_model()


OPENAI_API_KEY = settings.OPENAI_API_KEY  
openai.api_key = OPENAI_API_KEY

class ChatSerializer(serializers.ModelSerializer):
    sender = serializers.PrimaryKeyRelatedField(queryset=User.objects.all())
    recipient = serializers.PrimaryKeyRelatedField(queryset=Client.objects.all())
    recipient_name = serializers.SerializerMethodField()
    sender_name = serializers.SerializerMethodField()
    translated_message = serializers.SerializerMethodField()  

    class Meta:
        model = Chat
        fields = ['id', 'sender', 'recipient', 'message', 'timestamp', 'recipient_name', 'sender_name', 'translated_message']
        read_only_fields = ('id', 'timestamp', 'sender_name', 'recipient_name')

    def get_recipient_name(self, obj):
        return obj.recipient.name

    def get_sender_name(self, obj):
        return obj.sender.username

    def get_translated_message(self, obj, context=None): 
        """Translates the message to the language specified in the request using GPT-4o-mini."""
        language = context.get('language') if context else None 
        if not language:
            return obj.message  

        try:
            
            prompt = f"Translate the following English text to {language}: {obj.message}"

            
            response = openai.chat.completions.create(
              model="gpt-4o-mini", 
              messages=[
                {"role": "system", "content": "You are a helpful assistant that translates text. Give a simple, direct response"},
                {"role": "user", "content": prompt},
              ]
            )

            
            translated_text = response.choices[0].message.content
            return translated_text
        except Exception as e:
            return f"Translation Error: {e}"  