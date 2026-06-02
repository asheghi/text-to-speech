#!/bin/sh
echo "Running Application..."
# sherpa-onnx ships its native shared libs in an arch-specific package
# (sherpa-onnx-linux-x64 or sherpa-onnx-linux-arm64). Only the one matching the
# build/runtime arch is installed, so glob for whichever is present instead of
# hardcoding the arch — lets one image work on both x64 and arm64 hosts.
LIBDIR=$(ls -d "$PWD"/node_modules/sherpa-onnx-linux-* 2>/dev/null | head -n1)
export LD_LIBRARY_PATH="$LIBDIR:$LD_LIBRARY_PATH"
bun run server/index.ts
