#!/bin/sh

# Set your target environment details.
mlcpPath=/Users/dgrant/apps/mlcp-8.0-4/bin
host=dev-v84-ml1
port=9011
user=admin
passwd=admin

# Prod
# host=van-dev4.demo.marklogic.com
# port=8084
# user=dgrant
# passwd=


# Import the builds
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections builds \
  -input_file_path content/data/data/builds \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

# Import the configurations
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections configuration \
  -input_file_path content/data/data/configuration \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

# Import the countries
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections country \
  -input_file_path content/data/data/country \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

# Import the environments
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections environment \
  -input_file_path content/data/data/environment \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

# Import the licenses
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections license \
  -input_file_path content/data/data/license \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

# Import the people
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections person \
  -input_file_path content/data/data/person \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

# Import the racks
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections rack \
  -input_file_path content/data/data/rack \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

# Import the routers
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections router \
  -input_file_path content/data/data/router \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

# Import the systems
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections system \
  -input_file_path content/data/data/system \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

# Import the relationships
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections relationships \
  -input_file_path content/data/data/relationships.json \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

# Import the relationships
$mlcpPath/mlcp.sh import  \
  -username $user \
  -password $passwd \
  -host $host  \
  -port $port \
  -mode local \
  -output_collections downedData \
  -input_file_path content/data/data/downedResources.json \
  -output_permissions semantics-demo-role,read \
  -output_uri_replace ".*\/content/data/data,'/data'"

