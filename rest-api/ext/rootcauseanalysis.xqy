xquery version "1.0-ml";

module namespace rca = "http://marklogic.com/rest-api/resource/rootcauseanalysis";

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
function rca:get(
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

    select ?sourceDocURI (?sourceLabel as ?source) (concat(replace(?sourceType, "http://semantics-demo/object-type/", ""), ?status2) as ?sObjectType) (?relLabel as ?type) ?targetDocURI (?targetLabel as ?target) (replace(?targetType, "http://semantics-demo/object-type/", "") as ?tObjectType)
    where {
      values ?rel {  rel:isPartOfSys rel:isConnectedToRouter rel:runsOnEnv rel:mountedInRack rel:isInRoom rel:level rel:building rel:city rel:country }
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
        select ?constrainingSourceID
        where {
          ?constrainingSourceID (^rel:isPartOfSys|rel:isConnectedToRouter|rel:runsOnEnv|rel:mountedInRack|rel:isInRoom|rel:level|rel:building|rel:city|rel:country)* ?scope
        }
      }
      optional {
        #?constrainingSourceID a t:serverphysical;
        #          :status ?status .
        ?constrainingSourceID rel:status ?status
      }
      bind ((if(bound(?status), concat(" ", ?status),"")) AS ?status2)
    }
    order by ?source ?type'
  let $scope := map:get($params, "scope")
  return
    (
      xdmp:set-response-content-type("application/json; charset=utf-8"),
      document {
        xdmp:to-json(sem:sparql(
          $query,
          map:new((
            map:entry("scope", sem:iri("http://semantics-demo/" || $scope))
          ))
        ))
      }
    )
};
