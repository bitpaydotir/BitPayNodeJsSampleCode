const axios = require('axios')
const FormData = require("form-data")
const express = require('express')
const app = express()

app.get('/pay', (req, res) => {
    //create form-data
    const form = new FormData()
    form.append("api", "*****-*****-*****-*****-****************************") //your_api -> required
    form.append("amount", 10000) //your_amount -> required
    form.append("redirect", "https://example.ir/your_redirect") //your_redirect -> required
    form.append("name", "") //your_name -> optional
    form.append("email", "") //your_email -> optional
    form.append("description", "") //your_description -> optional
    form.append("factorId", 1) //your_factorId -> optional
    // step1: send form-data to bitpay
    axios({
        method: "post",
        url: "https://bitpay.ir/payment/gateway-send",
        data: form,
        headers: {...form.getHeaders()}
    })
        .then(function (response) {
            //console.log('data',response.data);
            // step2: handle returned data from bitpay
            if (response.data === -1)
                res.send('خطا: API ارسالی صحیح نیست!')
            else if (response.data === -2)
                res.send('خطا: amount داده عددی نمی باشد یا کمتر از 1000 ريال می باشد')
            else if (response.data === -3)
                res.send('خطا: مقدار redirect رشته null است')
            else if (response.data === -4)
                res.send('خطا: درگاهی با اطلاعات ارسالی شما وجود ندارد و یا در حالت انتظار میباشد')
            else if (response.data === -5)
                res.send('خطا: خطا در اتصال به درگاه، لطفا مجددا تلاش کنید')
            else if (typeof response.data === 'number' && response.data > 0) {
                // step3: redirect to Bank portal
                res.redirect(`https://bitpay.ir/payment/gateway-${response.data}-get`)
            }
        })
        .catch(err => {
            console.log(err)
        })
})


//step4: handle redirect
app.get('/pay/get_redirect', (req, res) => {
    //get queryString from request
    let transId = req.query.trans_id
    let idGet = req.query.id_get
    //verify Bank transaction
    if (transId > 0) {
        const form = new FormData()
        form.append("api", "*****-*****-*****-*****-****************************")
        form.append("trans_id", transId)
        form.append("id_get", idGet)
        form.append("json", 1)
        axios({
            method: "post",
            url: "https://bitpay.ir/payment/gateway-result-second",
            data: form,
            headers: {...form.getHeaders()}
        })
            .then(jsonResponse => {
                //console.log(jsonResponse.data)
                let status = jsonResponse.data.status
                let amount = jsonResponse.data.amount
                let cardNum = jsonResponse.data.cardNum
                let factorId = jsonResponse.data.factorId
                switch (status) {
                    case -1 :
                        res.send('خطا: API ارسالی صحیح نیست!')
                        break
                    case -2 :
                        res.send('خطا: trans_id ارسال شده، داده عددی نمی باشد')
                        break
                    case -3 :
                        res.send('خطا: id_get ارسال شده، داده عددی نمی باشد')
                        break
                    case -4 :
                        res.send('خطا: چنین تراکنشی در پایگاه داده وجود ندارد و یا موفقیت آمیز نبوده')
                        break
                    case 1 :
                        res.send('تراکنش موفقیت آمیز بوده')
                        break
                    case 11 :
                        res.send('تراکنش از قبل وریفای شده')
                        break
                }
            })
            .catch(err => {
                console.log(err)
            })
    }else{
        res.send(`خطا در transId. ${transId}`)
    }
})


app.listen(2132)
