#!/bin/bash
# Publish OTA update to preview channel
echo "📦 Publishing OTA update to preview channel..."
npx eas-cli update --branch preview --message "$1"
echo "✅ Update published! Users will receive it on next app launch."
