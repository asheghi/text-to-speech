#!/bin/sh
echo "Running Application..."
export LD_LIBRARY_PATH=$PWD/node_modules/sherpa-onnx-linux-x64:$LD_LIBRARY_PATH
bun run server/index.ts