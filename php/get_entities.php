<?php
$mode = $_GET['mode'];
$command = '';
if ('reactome_entity_id' == $mode) {
    $command = escapeshellcmd('python ../scripts/get_entities_by_reactome_id.py ' . $_GET['ids']);}
elseif ('reactome_pathway_id' == $mode) {
    $command = escapeshellcmd('python ../scripts/get_entities_in_pathway.py ' . $_GET['id']);}
$output = shell_exec($command);
echo($output);
?>