#!/bin/bash

# Ensure the models directory exists in dist
mkdir -p dist/models

# Copy all models
cp -r public/models/* dist/models/

echo "Public assets copied successfully!" 