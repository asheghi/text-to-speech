FROM oven/bun:debian

RUN apt-get update

# ffmpeg encodes the optional flac/opus transport formats (server/lib/encodeAudio.ts).
RUN apt-get install -y --no-install-recommends bzip2 ffmpeg

WORKDIR /app

# Copy the lock and package file
COPY bun.lockb . 
COPY package.json . 

# Install dependencies
RUN bun install --frozen-lockfile

# Copy your source code
# If only files in the src folder changed, this is the only step that gets executed!
COPY . .

RUN bun run build

RUN chmod +x dockerEntryPoint.sh

ENTRYPOINT ["./dockerEntryPoint.sh"]