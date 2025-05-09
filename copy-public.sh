#!/bin/bash

# Ensure the models directory exists in dist
mkdir -p dist/models

# Copy all models from the root 'models' directory
cp -r models/* dist/models/

echo "Project models copied successfully!" 