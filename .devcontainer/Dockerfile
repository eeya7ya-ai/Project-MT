FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV FLUTTER_VERSION=3.29.0
ENV FLUTTER_HOME=/opt/flutter
ENV PATH="${FLUTTER_HOME}/bin:${PATH}"

# System deps
RUN apt-get update && apt-get install -y \
    curl xz-utils git zip unzip \
    libglu1-mesa clang cmake ninja-build \
    pkg-config libgtk-3-dev \
    python3 python3-pip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Create non-root user first
RUN groupadd --gid 1000 vscode \
    && useradd --uid 1000 --gid 1000 -m vscode

# Install Flutter from official archive (no git clone, avoids all branch/HEAD issues)
RUN curl -fsSL \
    "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER_VERSION}-stable.tar.xz" \
    -o /tmp/flutter.tar.xz \
    && tar -xf /tmp/flutter.tar.xz -C /opt \
    && rm /tmp/flutter.tar.xz \
    && chown -R vscode:vscode /opt/flutter

# Switch to non-root and warm up Flutter
USER vscode
RUN flutter config --no-analytics \
    && flutter precache --no-android --no-ios --no-fuchsia

# Install Python backend deps
USER root
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

USER vscode
