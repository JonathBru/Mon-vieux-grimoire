const Book = require('../models/books');

const fs = require('fs');

const compressImg = require('../middleware/compress-img');


exports.createBook = async (req, res) => {
    let bookObject = JSON.parse(req.body.book);
    delete bookObject._id;
    delete bookObject._userId;
    const compressedImg = await compressImg(req.file.buffer);
    const book = new Book({
        ...bookObject,
        imageUrl: compressedImg,
    });
    book.averageRating = book.calculateAverageRating();
    book.save()
        .then(() => res.status(201).json({ message: 'Livre enregistré !'}))
        .catch((error) => {res.status(400).json({ error })});
};

exports.modifyBook = async (req, res) => {
    delete req.body.ratings;
    if(req.file) {
        req.body.imageUrl = await compressImg(req.file.buffer)
    }
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if(book.userId != req.auth.userId) {
                res.status(401).json({ message: 'Non autorisé !' });
            } else {
                if(req.file) {
                    const filename = book.imageUrl;
                    fs.unlink(`images/${filename}`, () => {                 
                        Book.updateOne({ _id: req.params.id }, { ...req.body })
                            .then(() => res.status(200).json({ message: 'Livre modifié !'}))
                            .catch(error => res.status(400).json({ error }));
                    })
                } else {
                    Book.updateOne({ _id: req.params.id }, { ...req.body })
                            .then(() => res.status(200).json({ message: 'Livre modifié !'}))
                            .catch(error => res.status(400).json({ error }));
                }
            }
        })
        .catch((error) => {
            res.status(500).json({ error });
        });
};

exports.getOneBook = (req, res) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if (!book) {
                return res.status(404).json({ message: 'Livre non trouvé.' });
            }
            book.imageUrl = `${req.protocol}://${req.get('host')}/images/${book.imageUrl}`;
            res.status(200).json(book);
        })
        .catch((error) => {
            res.status(500).json({ error });
        });
};

exports.getAllBooks = (req, res) => {
    Book.find()
        .then((books) => {
            books.forEach((book) => {
                book.imageUrl = `${req.protocol}://${req.get('host')}/images/${book.imageUrl}`;
            });
            res.status(200).json(books);
        })
        .catch((error) => {
            res.status(400).json({ error });
        });
};

exports.deleteOneBook = (req, res) => {
    Book.findOne({ _id: req.params.id })
        .then((book) => {
            if(book.userId != req.auth.userId) {
            res.status(401).json({ message: 'Non autorisé !' });
            } else {
            const filename = book.imageUrl;
            fs.unlink(`images/${filename}`, () => {
                Book.deleteOne({ _id: req.params.id })
                .then(() => res.status(200).json({ message: 'Livre supprimé !'}))
                .catch(error => res.status(400).json({ error }));
            })
            }
        })
        .catch( error => {
            res.status(500).json({ error });
        });
};

exports.addRating = (req, res) => {  
    Book.findOne({ _id: req.params.id })
        .then(book => {
            const alreadyRated = book.ratings.some((rating) => rating.userId.toString() === req.body.userId);
            if (alreadyRated) {
                return res.status(401).json({ message: 'Une note a déjà été réalisée !' });
            } else {
                book.ratings.push({ userId: req.body.userId, grade: req.body.rating });
                book.averageRating = book.calculateAverageRating();
                return book.save()
                    .then(updatedRating => {
                        res.status(200).json(updatedRating);
                    })
                    .catch(error => res.status(400).json({ error }))
            }
        })
        .catch(error => res.status(500).json({ error }));
};



exports.bestRating = (req, res) => {
    // Recherche tous les livres triés par note moyenne décroissante et limité à 3 résultats
    Book.find()
        .sort({ averageRating: -1 })
        .limit(3)
        .then((books) => {
            // Utilise forEach pour modifier chaque livre en ajoutant le protocole et l'hôte à l'URL de l'image
            books.forEach((book) => {
                book.imageUrl = `${req.protocol}://${req.get('host')}/images/${book.imageUrl}`;
            });

            res.status(200).json(books);
        })
        .catch((error) => {
            res.status(500).json({ error });
        });
};