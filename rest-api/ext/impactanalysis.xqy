xquery version "1.0-ml";

module namespace ia = "http://marklogic.com/rest-api/resource/impactanalysis";

declare namespace roxy = "http://marklogic.com/roxy";

import module namespace sem = "http://marklogic.com/semantics"
  at "/MarkLogic/semantics.xqy";

(:
 : To add parameters to the functions, specify them in the params annotations.
 : Example
 :   declare %roxy:params("uri=xs:string", "priority=xs:int") dmlc:get(...)
 : This means that the get function will take two parameters, a string and an int.
 :)

(:
 :)
declare
%roxy:params("scope=xs:string")
function ia:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  let $query :=
    'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    prefix conf: <http://semantics-demo/configuration/>
    prefix rel: <http://semantics-demo/relationship/>
    prefix t: <http://semantics-demo/object-type/>
    prefix p: <http://semantics-demo/person/>
    prefix lic: <http://semantics-demo/softwareLicense/>
    prefix sw: <http://semantics-demo/software/>
    prefix swbld: <http://semantics-demo/softwareBuild/>
    prefix cntry: <http://semantics-demo/country/>
    prefix cty: <http://semantics-demo/city/>
    prefix bldg: <http://semantics-demo/building/>
    prefix lvl: <http://semantics-demo/level/>
    prefix rm: <http://semantics-demo/room/>
    prefix rk: <http://semantics-demo/rack/>
    prefix rt: <http://semantics-demo/router/>
    prefix env: <http://semantics-demo/env/>
    prefix sys: <http://semantics-demo/system/>

    select distinct ?sourceDocURI (?sourceLabel as ?source) (concat(replace(?sourceType, "http://semantics-demo/object-type/", ""), ?status) as ?sObjectType) (?relLabel as ?type) ?targetDocURI (?targetLabel as ?target) (concat(replace(?targetType, "http://semantics-demo/object-type/", ""), ?status2) as ?tObjectType)
    #select distinct (?sourceLabel as ?source) (concat(replace(?sourceType, "http://semantics-demo/object-type/", ""), ?status) as ?sObjectType) (?targetLabel as ?target) (concat(replace(?targetType, "http://semantics-demo/object-type/", ""), ?status2) as ?tObjectType)
    where {
      values ?rel { rel:isPartOfSys rel:isConnectedToRouter rel:runsOnEnv rel:mountedInRack rel:isInRoom rel:level rel:building rel:city rel:country }
      ?constrainingSourceID ?rel ?targetID;
                a ?sourceType;
                rdfs:label ?sourceLabel;
                rel:docURI ?sourceDocURI .
      ?rel rdfs:label ?relLabel .
      ?targetID rdfs:label ?targetLabel;
              a ?targetType;
              rel:docURI ?targetDocURI .
      minus { ?scope ?rel ?o }
      {
        select ?constrainingSourceID ?status
        where {
          {
            select ?constrainingSourceID ("" as ?status)
            where {
              #?constrainingSourceID (rel:isPartOfSys|rel:basedOnBuild/rel:hasSoftware|(rel:isConnectedToRouter*|rel:runsOnEnv+/rel:mountedInRack*)/rel:isInRoom*/rel:level*/rel:building*/rel:city*/rel:country*) ?scope
              ?constrainingSourceID (^rel:isPartOfSys|rel:isConnectedToRouter|rel:runsOnEnv|rel:mountedInRack|rel:isInRoom|rel:level|rel:building|rel:city|rel:country)* ?scope
              minus {
                #?constrainingSourceID (rel:isPartOfSys|rel:basedOnBuild/rel:hasSoftware|(rel:isConnectedToRouter*|rel:runsOnEnv+/rel:mountedInRack*)/rel:isInRoom*/rel:level*/rel:building*/rel:city*/rel:country*) ?downRootEntity
                ?constrainingSourceID (^rel:isPartOfSys|rel:isConnectedToRouter|rel:runsOnEnv|rel:mountedInRack|rel:isInRoom|rel:level|rel:building|rel:city|rel:country)* ?downRootEntity
              }
            }
          }
          UNION
          {
            select ?constrainingSourceID (" down" as ?status)
            where {
              #?constrainingSourceID (rel:isPartOfSys|rel:basedOnBuild/rel:hasSoftware|(rel:isConnectedToRouter*|rel:runsOnEnv+/rel:mountedInRack*)/rel:isInRoom*/rel:level*/rel:building*/rel:city*/rel:country*) ?downRootEntity
              ?constrainingSourceID (^rel:isPartOfSys|rel:isConnectedToRouter|rel:runsOnEnv|rel:mountedInRack|rel:isInRoom|rel:level|rel:building|rel:city|rel:country)* ?downRootEntity
            }
          }
        }
      }
      bind(if(?downRootEntity = ?targetID, " down entity", "") as ?status2)
    }
    order by ?source ?type'
  let $scope := map:get($params, "scope")
  let $down-root-entity := map:get($params, "downrootentity")
  return
    (
      xdmp:set-response-content-type("application/json; charset=utf-8"),
      document {
        xdmp:to-json(sem:sparql(
          $query,
          map:new((
            map:entry("scope", sem:iri("http://semantics-demo/" || $scope)),
            map:entry("downRootEntity", sem:iri("http://semantics-demo/" || $down-root-entity))
          ))
        ))
      }
    )
};
