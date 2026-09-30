# WhatsApp Webhook Setup Guide

This document outlines how to connect the SPIN Backend to the WhatsApp Cloud API (Meta Graph API).

## Prerequisites
1. A **Meta Developer Account** (https://developers.facebook.com/)
2. A **WhatsApp Business Account (WABA)** registered in your Meta Developer portal.
3. Access to your deployed SPIN API endpoint (e.g., `https://api.niketandoes.me`).

## 1. Configure the Webhook in Meta Developer Portal
1. Go to your Meta App Dashboard > **WhatsApp** > **Configuration**.
2. Click **Edit** next to Webhook.
3. Enter your **Callback URL**: `https://api.niketandoes.me/webhook/whatsapp`
4. Enter your **Verify Token**. (This must match the `WHATSAPP_VERIFY_TOKEN` you set in your `.env` file on the backend). 
5. Click **Verify and Save**. Meta will instantly send a `GET` request to your callback URL with a `hub.challenge`. The SPIN backend automatically echoes it back.

## 2. Subscribe to Messages
1. Still on the WhatsApp Configuration page, under **Webhook fields**, click **Manage**.
2. Subscribe to the `messages` event. (This routes all incoming WhatsApp messages to your `POST` webhook).

## 3. Environment Variables (.env)
Make sure the following variables are set on your production server running the SPIN API:

```env
WHATSAPP_VERIFY_TOKEN="your-secure-random-string"
WHATSAPP_API_TOKEN="EAAX... (Your Permanent Page Access Token)"
WHATSAPP_PHONE_NUMBER_ID="1234567890 (From Meta Dashboard)"
```

## How It Works
- **Ingestion**: When a citizen messages the WhatsApp bot, Meta sends a JSON payload to `POST /webhook/whatsapp`.
- **Parsing**: The backend extracts the phone number and the text (or audio voice note ID).
- **Processing**: It passes the message to `process_citizen_webhook()` in the SPIN pipeline.
- **Reply**: Once processed, the backend uses the `WHATSAPP_API_TOKEN` to send a POST request to the Meta Graph API to message the user back with their grievance tracking ID.
