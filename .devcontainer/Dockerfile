FROM ubuntu:22.04

ENV DEBIAN_FRONTEND=noninteractive
ENV FLUTTER_HOME=/opt/flutter
ENV FLUTTER_VERSION=3.29.0
ENV PATH="${FLUTTER_HOME}/bin:${PATH}"

# Base tools
RUN apt-get update && apt-get install -y \
    curl git wget unzip xz-utils zip \
    libglu1-mesa clang cmake ninja-build \
    pkg-config libgtk-3-dev \
    python3 python3-pip python3-venv \
    ca-certificates gnupg \
    && rm -rf /var/lib/apt/lists/*

# Flutter SDK
RUN git clone --depth 1 --branch ${FLUTTER_VERSION} \
    https://github.com/flutter/flutter.git ${FLUTTER_HOME} \
    && flutter precache --no-android --no-ios \
    && flutter config --no-analytics \
    && flutter doctor

# Python deps for backend
COPY backend/requirements.txt /tmp/requirements.txt
RUN pip3 install --no-cache-dir -r /tmp/requirements.txt

# Non-root user
ARG USERNAME=vscode
ARG USER_UID=1000
ARG USER_GID=${USER_UID}
RUN groupadd --gid ${USER_GID} ${USERNAME} \
    && useradd --uid ${USER_UID} --gid ${USER_GID} -m ${USERNAME} \
    && chown -R ${USERNAME}:${USERNAME} ${FLUTTER_HOME}

USER ${USERNAME}

# Pre-warm Flutter pub cache for both apps
COPY --chown=${USERNAME} apps/admin_app/pubspec.yaml /tmp/admin_app/pubspec.yaml
COPY --chown=${USERNAME} apps/technician_app/pubspec.yaml /tmp/technician_app/pubspec.yaml
RUN cd /tmp/admin_app && flutter pub get || true
RUN cd /tmp/technician_app && flutter pub get || true
