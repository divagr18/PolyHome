import streamlit as st
import requests
import json


API_ENDPOINT = "http://127.0.0.1:8000/api/chats/"  

def send_message(sender_id, recipient_id, message):
    """Sends a message to the API."""
    try:
        data = {
            "sender": sender_id,
            "recipient": recipient_id,
            "message": message
        }
        headers = {'Content-type': 'application/json'}
        response = requests.post(API_ENDPOINT, data=json.dumps(data), headers=headers)
        response.raise_for_status()  
        return response.json()
    except requests.exceptions.RequestException as e:
        return f"Error: {e}"


st.title("Chat Message Sender")


sender_id = st.number_input("Sender ID", min_value=1, value=1, step=1)
recipient_id = st.number_input("Recipient ID", min_value=1, value=2, step=1)
message = st.text_area("Message", "Type your message here...")


if st.button("Send Message"):
    result = send_message(sender_id, recipient_id, message)
    st.write("API Response:")
    st.write(result)