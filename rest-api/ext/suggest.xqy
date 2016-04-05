xquery version "1.0-ml";

module namespace suggest = "http://marklogic.com/rest-api/resource/suggest";

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
%roxy:params("str=xs:string")
function suggest:get(
  $context as map:map,
  $params  as map:map
) as document-node()*
{
  let $query :=
    'prefix rdfs: <http://www.w3.org/2000/01/rdf-schema#>
    select (replace(?s, "http://semantics-demo/", "") as ?p)
    where {
      ?s rdfs:label ?label
      FILTER(strstarts(str(?s), concat("http://semantics-demo/", ?str)))
    }
    #limit ?maxresponses'
  let $str := map:get($params, "str")
  (:let $maxresponses := map:get($params, "maxresponses"):)
  return
    (
      xdmp:set-response-content-type("application/json; charset=utf-8"),
      document {
        xdmp:to-json(json:to-array(
          <x>{
            sem:sparql(
              $query,
              map:new((
                map:entry("str", $str) (:,
                map:entry("maxresponses", $maxresponses):)
              ))
            )
          }</x>//*:value/string()
        ))
        (:
        <Suggestions>{
            <x>{sem:sparql(
              $query,
              map:new((
                map:entry("str", $str),
                map:entry("maxresponses", $maxresponses)
              ))
            )}</x>//*:value ! <suggestion>{string(.)}</suggestion>
        }</Suggestions>
        :)
      }
    )
};
