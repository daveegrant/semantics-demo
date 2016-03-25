#!/bin/sh

# Set your target environment details.
mlcpPath=/Users/dgrant/apps/mlcp-8.0-4/bin
host=dev-v84-ml1
port=9011
user=admin
passwd=admin


# Import the XBRL ontologies
$mlcpPath/mlcp.sh export  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_file_path content/data


# -output_uri_prefix
