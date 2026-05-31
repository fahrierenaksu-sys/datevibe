# DateVibe Mobile (MVP Branch)

## iOS Toolchain Requirement (Expo 52 / RN 0.76)

Current mobile stack for this branch:
- `expo`: `^52.0.0`
- `react-native`: `0.76.9`
- `react-native-screens`: `4.4.0`
- `react-native-safe-area-context`: `4.12.0`
- `@react-native-async-storage/async-storage`: `1.23.1`

Use a compatible older Xcode for this branch.  
Do not use newer Xcode toolchains (for example Xcode 26.4) with this stack; native iOS builds can fail in `Pods/fmt` / `folly` with errors like:
- `call to consteval function ... is not a constant expression`

### Switch Xcode

```bash
sudo xcode-select -s /Applications/Xcode_<compatible-version>.app/Contents/Developer
xcodebuild -version
sudo xcodebuild -runFirstLaunch
```

### Clean iOS Rebuild

From `apps/mobile`:

```bash
rm -rf ios/Pods ios/Podfile.lock ios/build
rm -rf ~/Library/Developer/Xcode/DerivedData/*
npx expo prebuild --clean --platform ios
npx expo run:ios
```

If dependencies are being reinstalled from the monorepo root, use:

```bash
cd /Users/evrenevren/datevibe
npm install --legacy-peer-deps
```
