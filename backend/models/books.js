const mongoose = require('mongoose');

const booksSchema = mongoose.Schema({
    userId: {type: String , required: true},
    title: {type: String, required: true},
    author: {type: String, required: true},
    imageUrl: {type: String, required: true},
    year: {type: Number, required: true},
    genre: {type: String, required: true},
    ratings : [ 
        {   
                userId: {type: String, required: true},     
                grade: {type: Number, required: true, min: 0, max: 5},
        }
    ],
    averageRating: {type: Number, required: false},
});

booksSchema.methods.calculateAverageRating = function () {
    const totalRatings = this.ratings.length;
  
    if (totalRatings === 0) {
        return 0; 
    } else {
        const sumRatings = this.ratings.reduce((sum, rating) => sum + rating.grade, 0);
        const averageRating = Math.round(sumRatings / totalRatings);
        
        return averageRating;
    }
};

module.exports = mongoose.model('Books', booksSchema);