-- Test genérico: el valor está dentro de [min_value, max_value]
{% test value_in_range(model, column_name, min_value, max_value) %}
select * from {{ model }}
where {{ column_name }} < {{ min_value }} or {{ column_name }} > {{ max_value }}
{% endtest %}
