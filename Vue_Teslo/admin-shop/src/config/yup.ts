import * as yup from 'yup'

yup.setLocale({
    mixed: {
        default: 'No es válido',
        required: 'Este campo es requerido',
        oneOf: 'Debe de ser uno de los siguientes valores ${values}' //seleccionado algo fuera de la lista de valores
    }
})