#!/bin/sh

# Set your target environment details.
mlcpPath=/Users/dgrant/apps/mlcp-8.0-4/bin
host=dev-v84-ml1
port=9011
user=admin
passwd=admin


# Import the XBRL ontologies
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -input_file_path content/rdf/ \
  -input_file_type RDF \
  -output_collections rdf \
  -output_uri_prefix /rdf/


# -output_uri_prefix
