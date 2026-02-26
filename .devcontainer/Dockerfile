FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV FLUTTER_HOME=/opt/flutter
ENV FLUTTER_VERSION=3.29.0
ENV PATH="${FLUTTER_HOME}/bin:${PATH}"

# Base tools
RUN apt-get update && apt-get install -y \
    curl git xz-utils zip unzip \
    libglu1-mesa clang cmake ninja-build \
    pkg-config libgtk-3-dev \
    python3 python3-pip \
    ca-certificates \
    && rm -rf /var/lib/apt/lists/*

# Non-root user (must be created BEFORE Flutter install)
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=${USER_UID}
RUN groupadd --gid ${USER_GID} ${USERNAME} \
    && useradd --uid ${USER_UID} --gid ${USER_GID} -m ${USERNAME}

# Flutter SDK via official release archive (avoids all git/shallow-clone issues)
RUN curl -fsSL \
    "https://storage.googleapis.com/flutter_infra_release/releases/stable/linux/flutter_linux_${FLUTTER_VERSION}-stable.tar.xz" \
    -o /tmp/flutter.tar.xz \
    && tar -xf /tmp/flutter.tar.xz -C /opt \
    && rm /tmp/flutter.tar.xz \
    && chown -R ${USERNAME}:${USERNAME} ${FLUTTER_HOME}

USER ${USERNAME}

# Warm up Flutter (runs as non-root, no doctor needed)
RUN flutter config --no-analytics \
    && flutter precache --no-android --no-ios --no-fuchsia

# Python deps for backend (as root for system-wide install)
USER root
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

USER ${USERNAME}
