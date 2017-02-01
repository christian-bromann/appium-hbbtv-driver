import merge from 'webpack-merge'

import common from './common'

const config = {
    devtool: 'eval',
    cache: true,
    module: {
        loaders: []
    }
}

export default merge(common, config)
