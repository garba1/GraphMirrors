<?php
echo('../' . $_GET['logfile']);
file_put_contents('../' . $_GET['logfile'], $_GET['entry'], FILE_APPEND);
?>