#!/bin/bash

PROTO_DIR=./../../proto

yarn proto-loader-gen-types --grpcLib=@grpc/grpc-js --outDir=src/proto/ ./../proto/*.proto