#!/bin/bash


echo ""
echo "[--- C4P : DEV Build mobile ---]"
echo ""

sudo npm update -g cordova
rm -rf build

cordova create build com.apps4pro.c4pdev c4p

cp -r www build/.
cp build/www/config.xml build/config.xml

oldstring='src=\"mobile_res\/'
newstring='src=\"..\/www\/mobile_res\/'
sed -i.bak "s#$oldstring#$newstring#g" build/config.xml


cd build
cordova platform add ios
#cordova platform add android

cordova plugin add org.apache.cordova.device
cordova plugin add org.apache.cordova.network-information
cordova plugin add org.apache.cordova.battery-status
cordova plugin add org.apache.cordova.device-motion
cordova plugin add org.apache.cordova.device-orientation
cordova plugin add org.apache.cordova.geolocation
cordova plugin add org.apache.cordova.camera
cordova plugin add org.apache.cordova.media
cordova plugin add org.apache.cordova.media-capture
cordova plugin add org.apache.cordova.file
cordova plugin add org.apache.cordova.file-transfer
cordova plugin add org.apache.cordova.dialogs
cordova plugin add org.apache.cordova.vibration
cordova plugin add org.apache.cordova.contacts
cordova plugin add org.apache.cordova.globalization
cordova plugin add org.apache.cordova.splashscreen
cordova plugin add org.apache.cordova.inappbrowser
cordova plugin add org.apache.cordova.console

#cordova plugin add https://github.com/phonegap-build/GAPlugin.git
cordova plugin add https://github.com/phonegap-build/StatusBarPlugin.git
cordova plugin add https://github.com/hazemhagrass/ContactPicker.git
cordova plugin add https://github.com/mhweiner/CordovaiOSKeyboardPlugin.git

#cordova plugin add https://github.com/EddyVerbruggen/LaunchMyApp-PhoneGap-Plugin.git --variable URL_SCHEME=a4pc4pdev
#cordova plugin add https://github.com/net.tunts.webintent.git
#cordova plugin add https://github.com/Tunts/WebIntent.git
#cordova plugin add https://github.com/pwlin/cordova-plugin-file-opener2.git
#cordova plugin add https://github.com/Initsogar/cordova-webintent.git
cordova plugin add https://github.com/mlefree/WebIntent.git

cordova build ios

# Sed AndroidManifest
oldstring='<\/intent-filter>'
newstring='<\/intent-filter ><intent-filter><action android:name="android.intent.action.SEND"\/><action android:name="android.intent.action.SEND_MULTIPLE"\/><category android:name="android.intent.category.DEFAULT"\/><data android:mimeType="application\/pdf"\/><\/intent-filter>'
#newstring='<\/intent-filter ><intent-filter><action android:name="android.intent.action.VIEW"\/><action android:name="android.intent.action.EDIT"\/><category android:name="android.intent.category.BROWSABLE"\/><category android:name="android.intent.category.DEFAULT"\/><data android:scheme="file" android:mimeType="application\/pdf"\/><data android:scheme="content" android:mimeType="application\/pdf"\/><\/intent-filter>'
#newstring='<\/intent-filter ><intent-filter><action android:name="android.intent.action.VIEW"\/><action android:name="android.intent.action.EDIT"\/><category android:name="android.intent.category.BROWSABLE"\/><data android:scheme="file" android:mimeType="application\/pdf"\/><data android:scheme="content" android:mimeType="application\/pdf"\/><\/intent-filter>'
#newstring='<\/intent-filter ><intent-filter><action android:name="android.intent.action.VIEW"><\/action><category android:name="android.intent.category.DEFAULT"><\/category><category android:name="android.intent.category.BROWSABLE"><\/category><data android:scheme="content" android:mimeType="*\/*"><\/data><data android:scheme="file" android:mimeType="*\/*"\/><data android:host="www.youtube.com" android:scheme="http"><\/data><\/intent-filter>'
sed -i.bak "s#$oldstring#$newstring#g" platforms/android/AndroidManifest.xml

#cordova prepare android
oldstring='Theme.Black.NoTitleBar"'
newstring='Theme.Black.NoTitleBar" android:launchMode="singleTask" android:clearTaskOnLaunch="true"'
#sed -i.bak "s#$oldstring#$newstring#g" platforms/android/AndroidManifest.xml
#cordova compile android

#cd platforms/android
#ant release
#jarsigner -keystore ../../../../../c4p/c4p_html_ang/mobile_res/android_key/apps4pro-key.keystore -storepass apps4pro -digestalg SHA1 -sigalg MD5withRSA bin/C_d-release-unsigned.apk mykey
#cp bin/C_d-release-unsigned.apk ../../C_d.apk
#zipalign -f 4 ../../C_d.apk ../../C_d-aligned.apk
#cd ../..


cd ..
