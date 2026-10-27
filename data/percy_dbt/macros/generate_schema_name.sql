-- Esquemas limpios (staging, marts…) en lugar de main_staging, main_marts…
{% macro generate_schema_name(custom_schema_name, node) -%}
  {{ custom_schema_name or target.schema }}
{%- endmacro %}
