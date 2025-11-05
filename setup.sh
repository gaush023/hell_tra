#!/usr/bin/env bash

if [ ! -d "certs" ]; then
  echo "=> generating self-signed certs..."
  mkdir certs
  openssl req -x509 -nodes -days 365 -newkey rsa:2048 \
    -keyout certs/localhost.key \
    -out certs/localhost.crt \
    -subj "/CN=localhost"

  sudo security add-trusted-cert \
    -d \
    -r trustRoot \
    -k /Library/Keychains/System.keychain \
    certs/localhost.crt

else
  echo "=> certs already exist, skipping."
fi
