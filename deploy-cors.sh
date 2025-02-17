#!/bin/bash

# Deploy CORS configuration to Firebase Storage
gsutil cors set cors.json gs://susu-virtual-space.appspot.com 