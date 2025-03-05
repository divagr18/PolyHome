import logging
from django.shortcuts import get_object_or_404
from django.contrib.auth import get_user_model
from django.utils import timezone
from .models import Appointment
from clients.models import Client
import datetime

logger = logging.getLogger(__name__)
User = get_user_model()

def create_appointment_from_data(appointment_data, client_id):
    """
    Creates an Appointment object from extracted data, handling duplicate prevention.
    """
    property_name = appointment_data.get('property_name')
    date_str = appointment_data.get('date')
    time_str = appointment_data.get('time')

    if property_name and date_str and time_str:
        try:
            
            datetime_str = f"{date_str} {time_str}"
            datetime_object = datetime.datetime.strptime(datetime_str, "%Y-%m-%d %H:%M")
            datetime_object = timezone.make_aware(datetime_object)

            
            client = get_object_or_404(Client, pk=client_id)
            agent = get_object_or_404(User, pk=1)

            
            existing_appointment = Appointment.objects.filter(
                property_name=property_name,
                client=client,
                agent=agent,
                date_time__date=datetime_object.date()  
            ).first()

            if existing_appointment:
                logger.info(f"Skipping duplicate appointment for the same day: Property '{property_name}', Date='{datetime_object.date()}'")
            else:
                
                logger.info(f"Creating NEW Appointment for property '{property_name}', Date/Time='{datetime_object}'")  
                Appointment.objects.create(
                    property_name=property_name,
                    client=client,
                    agent=agent,
                    date_time=datetime_object
                )
                logger.info(f"Appointment Saved Successfully for property '{property_name}' from client {client.id}: {datetime_object}")
        except ValueError as ve:  
            logger.error(f"Invalid datetime format '{date_str} {time_str}': {ve}")
        except Exception as save_appointment_error:
            logger.error(f"Error saving appointment for property '{property_name}': {save_appointment_error}")
    else:
        logger.warning(f"Skipping appointment save - Missing property_name, date, or time in extracted data.")